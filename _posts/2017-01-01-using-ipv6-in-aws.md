---
layout: post
title: Using IPv6 in AWS
date: 2017-01-01 22:34
author: alex
---

# Using IPv6 in Amazon Web Services #

Years in the works, in December Amazon beat both Google and Microsoft to introducing support for IPv6
networking to their compute offering!  This is fantastic news, and I recommend reading [Jeff Barr's
post for more](https://aws.amazon.com/blogs/aws/new-ipv6-support-for-ec2-instances-in-virtual-private-clouds/).

Unfortunately my excitement died down a bit after finding that there isn't yet much information about
getting off the ground with IPv6.  Ultimately it was pretty intuitive but it did require a bit of fumbling
around in the AWS console.  I've documented the full process here, so hopefully I'll be able to save you
some time!


#### AWS abbreviations ####
- _AZ - Availability Zone_
- _EC2 - Elastic Compute Cloud_
- _IGW - Internet Gateway_
- _SG - Security Group_
- _VPC - Virtual Private Cloud_


## Configuring a VPC to support IPv6 ##

#### _Note: Currently this is only available in the Ohio region (us-east-2) ._ ####

### 1) Add IPv6 CIDR to the VPC itself ###
- By default everybody gets one VPC per region.  If you've set-up other VPCs, these instructions
    will still work - you will just need to replicate custom routing in step #4.
- Every default VPC comes with a default IPv4 /16.
- On the "Edit CIDRs" page for each VPC, it's possible to allocate an IPv6 /56 to your VPC.
    Note that this is random, and unlike the IPv4 /16 which is strictly internal, this CIDR is
    comprised of public IP addresses.

### 2) Add IPv6 to VPC subnets ###
- By default there's one subnet per Availability Zone, IPv4 only
- Associate a subnet of the IPv6 CIDR we've just assigned to the VPC

### 3) Enable IPv6 auto-assign in subnets ###
- By default each subnet will auto-allocate IPv4
- From auto-assign IP settings, enable IPv6 

### 4) Update VPC route table to add IPv6 route to the IGW. ###
- By default, VPC route tables have 0.0.0.0/0 routed through a default Internet Gateway.
- We want to add a route with a Destination of "::/0" through the IGW.

### 5) Adjust Security Groups to allow IPv6 connections. ###
- Both newly created and historic SGs come with IPv4 rules pre-configured.
- You will want to add new rules for inbound and outbound IPv6 connectivity.
- Same pattern as before, and in regions which support IPv6 you'll find that new defaults
    have been added for IPv6 wildcards.  Unfortunately, you will have to double-up on rules.
- For inbound traffic, you can edit your existing rules and add the appropriate IPv6 CIDR to the end.
    e.g. "0.0.0.0/0" becomes "0.0.0.0/0, ::/0".
- Concerning outbound IPv6, it may be set up by default, if so you can safely skip the rest of this.
- You should be safe to allow all outbound traffic, using the same IPv6 CIDR as above!
- When altering existing outbound SG rules, at the very least make sure to enable IPv6 ICMP
    traffic, as it is used to replace ARP in IPv6!  Unfortunately I learned this the hard way :(

That's it, you're done!
Congratulations, your region is now IPv6 enabled.
Before you can use this with Compute resources there may be a little more set-up required...


## Using IPv6 in Compute ###

Most EC2 images will not support IPv6 out of the box, as AWS assigns IPv6 via DHCPv6 (and not SLAAC)
and at time of writing only the AMI for Amazon Linux has been updated to support this.
In-time, it's inevitable others will follow!

On a running instance you can do this manually with: `dhclient -v -6 -N`.
However, to survive reboots, you will want to modify the definition of your network interface so that
it can be assigned an IPv6 address via DHCP.

### Debian / Ubuntu ###

On Debian-like systems such as Ubuntu this can be achieved by creating a definition in `/etc/network/interfaces.d/`.
(On older systems you'll have to modify `/etc/network/interfaces` directly.)
```
iface eth0 inet6 dhcp
```

You can automate this with userdata when creating a new image.
```bash
#!/bin/bash
echo "iface eth0 inet6 dhcp" > /etc/network/interfaces.d/99-eth0-ipv6-dhcp.cfg

```

### Redhat / CentOS ###

On Redhat systems such as CentOS this is a little different, and you'll need to edit the network
script for eth0. `/etc/sysconfig/network-scripts/ifcfg-eth0`
```
IPV6INIT=yes
IPV6_AUTOCONF=no
DHCPV6C=yes
```

## Extras! ##

- It's also possible to use IPv6 internally, and to completely prevent inbound internet traffic.
    This involves the creation of a new "Egress Only Internet Gateway", which is essentially
    an IGW with a built in SG.
    After creating one of these, route "::/0" through this new gateway, instead of through a pre-existing one.

## Conclusion ##

I will update this post with CloudFormation configuration as soon as it is possible, as well as with some further thoughts and reflections on using this as time goes on.

As with everything, your mileage may vary.  That being said, if you have any questions or feedback, please don't hesitate to drop me a line.  I'm `@antoligy` on Twitter,  on Github and `alex` on StormBit.